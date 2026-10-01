import 'reflect-metadata';
import { GUARDS_METADATA } from '@nestjs/common/constants';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { Model, Types } from 'mongoose';
import { NoticeService } from './notice.service';
import { NoticeResolver } from './notice.resolver';
import { Notice } from '../../libs/dto/notice/notice';
import { NoticeInput, AllNoticesInquiry, PublicNoticesInquiry } from '../../libs/dto/notice/notice.input';
import { NoticeUpdate } from '../../libs/dto/notice/notice.update';
import { NoticeCategory, NoticeStatus } from '../../libs/enums/notice.enum';
import { MemberType } from '../../libs/enums/member.enum';
import { RolesGuard } from '../auth/guards/roles.guard';
import { AuthGuard } from '../auth/guards/auth.guard';
import { Direction } from '../../libs/enums/common.enum';

const id = new Types.ObjectId() as any;
const entry = {
	_id: id,
	noticeCategory: NoticeCategory.FAQ,
	noticeStatus: NoticeStatus.ACTIVE,
	noticeTitle: 'Question',
	noticeContent: 'Answer',
	memberId: id,
};
let model: any;
let service: NoticeService;

beforeEach(() => {
	model = {
		create: jest.fn().mockResolvedValue(entry),
		aggregate: jest.fn().mockReturnValue({ exec: jest.fn().mockResolvedValue([{ list: [], metaCounter: [] }]) }),
		findOneAndUpdate: jest.fn().mockReturnValue({ exec: jest.fn().mockResolvedValue(entry) }),
		findOneAndDelete: jest.fn().mockReturnValue({ exec: jest.fn().mockResolvedValue(entry) }),
	};
	service = new NoticeService(model as Model<Notice>);
});

test.each(['createNoticeByAdmin', 'getAllNoticesByAdmin', 'updateNoticeByAdmin', 'removeNoticeByAdmin'])(
	'%s requires the existing admin role guard',
	(method) => {
		const handler = NoticeResolver.prototype[method];
		expect(Reflect.getMetadata('roles', handler)).toEqual([MemberType.ADMIN]);
		expect(Reflect.getMetadata(GUARDS_METADATA, handler)).toContain(RolesGuard);
	},
);

test('public listing only exposes active notices and FAQs', async () => {
	await service.getNotices({ page: 1, limit: 10, noticeCategory: NoticeCategory.FAQ });
	expect(model.aggregate.mock.calls[0][0][0].$match).toEqual({ noticeCategory: NoticeCategory.FAQ, noticeStatus: NoticeStatus.ACTIVE });
	model.aggregate.mockClear();
	await expect(service.getNotices({ page: 1, limit: 10, noticeCategory: NoticeCategory.INQUIRY } as PublicNoticesInquiry)).rejects.toThrow();
	expect(model.aggregate).not.toHaveBeenCalled();
});

test('inquiries are authored by the signed-in member and only listed for that member', async () => {
	expect(Reflect.getMetadata(GUARDS_METADATA, NoticeResolver.prototype.createInquiry)).toContain(AuthGuard);
	expect(Reflect.getMetadata(GUARDS_METADATA, NoticeResolver.prototype.getMyInquiries)).toContain(AuthGuard);
	await service.createInquiry(id, { noticeTitle: 'Question', noticeContent: 'Details' });
	expect(model.create).toHaveBeenCalledWith({ noticeTitle: 'Question', noticeContent: 'Details', memberId: id, noticeCategory: NoticeCategory.INQUIRY, noticeStatus: NoticeStatus.HOLD });
	await service.getMyInquiries(id, { page: 1, limit: 10 });
	expect(model.aggregate.mock.calls[0][0][0].$match).toEqual({ noticeCategory: NoticeCategory.INQUIRY, memberId: id });
});

test('creation assigns the authenticated author and reports persistence failure', async () => {
	const input = { noticeCategory: NoticeCategory.FAQ, noticeTitle: 'Question', noticeContent: 'Answer' };
	await service.createNoticeByAdmin(id, input);
	expect(model.create).toHaveBeenCalledWith({ ...input, memberId: id });
	model.create.mockRejectedValue(new Error('Database failure'));
	await expect(service.createNoticeByAdmin(id, input)).rejects.toThrow('Create is failed!');
});

test('listing applies category, status, literal search and pagination before author lookup', async () => {
	await service.getAllNoticesByAdmin({
		page: 2,
		limit: 10,
		direction: Direction.DESC,
		search: { noticeCategory: NoticeCategory.FAQ, noticeStatus: NoticeStatus.HOLD, text: 'Why [now]?' },
	});
	const pipeline = model.aggregate.mock.calls[0][0];
	expect(pipeline[0].$match).toMatchObject({ noticeCategory: 'FAQ', noticeStatus: 'HOLD' });
	expect(pipeline[0].$match.noticeTitle.$regex.test('Why [now]?')).toBe(true);
	expect(pipeline[0].$match.noticeTitle.$regex.test('Why n')).toBe(false);
	expect(pipeline[2].$facet.list.slice(0, 2)).toEqual([{ $skip: 10 }, { $limit: 10 }]);
	expect(pipeline[2].$facet.metaCounter).toEqual([{ $count: 'total' }]);
});

test('updates allow active and held entries but never modify deleted entries', async () => {
	await service.updateNoticeByAdmin({ _id: id, noticeTitle: 'Updated' });
	expect(model.findOneAndUpdate).toHaveBeenCalledWith(
		{ _id: id, noticeStatus: { $in: ['ACTIVE', 'HOLD'] } },
		{ $set: { noticeTitle: 'Updated' } },
		{ new: true, runValidators: true },
	);
	model.findOneAndUpdate.mockReturnValue({ exec: jest.fn().mockResolvedValue(null) });
	await expect(service.updateNoticeByAdmin({ _id: id, noticeStatus: NoticeStatus.DELETE })).rejects.toThrow(
		'Update is failed!',
	);
});

test('permanent removal is restricted to deleted entries', async () => {
	await service.removeNoticeByAdmin(id);
	expect(model.findOneAndDelete).toHaveBeenCalledWith({ _id: id, noticeStatus: 'DELETE' });
	model.findOneAndDelete.mockReturnValue({ exec: jest.fn().mockResolvedValue(null) });
	await expect(service.removeNoticeByAdmin(id)).rejects.toThrow('Remove failed!');
});

test('malformed IDs are rejected before removal reaches the service', async () => {
	const resolver = new NoticeResolver(service);
	await expect(resolver.removeNoticeByAdmin('invalid')).rejects.toThrow('Bad Request');
	expect(model.findOneAndDelete).not.toHaveBeenCalled();
});

test('validation rejects blank content, null updates, invalid sorting and excessive page sizes', async () => {
	const create = plainToInstance(NoticeInput, { noticeCategory: 'FAQ', noticeTitle: '   ', noticeContent: '   ' });
	expect(await validate(create)).toHaveLength(2);
	const update = plainToInstance(NoticeUpdate, { _id: String(id), noticeTitle: null, noticeStatus: null });
	expect(await validate(update)).toHaveLength(2);
	const inquiry = plainToInstance(AllNoticesInquiry, {
		page: 0,
		limit: 101,
		sort: 'memberId',
		search: { text: 'x'.repeat(101) },
	});
	expect(await validate(inquiry)).toHaveLength(4);
});
