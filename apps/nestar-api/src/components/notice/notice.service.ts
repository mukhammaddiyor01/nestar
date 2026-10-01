import { BadGatewayException, BadRequestException, Injectable, InternalServerErrorException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, ObjectId } from 'mongoose';
import { Notice, Notices } from '../../libs/dto/notice/notice';
import { AllNoticesInquiry, InquiriesInquiry, InquiryInput, NoticeInput, PublicNoticesInquiry } from '../../libs/dto/notice/notice.input';
import { Direction, Message } from '../../libs/enums/common.enum';
import { T } from '../../libs/types/common';
import { lookupMember } from '../../libs/config';
import { NoticeUpdate } from '../../libs/dto/notice/notice.update';
import { NoticeCategory, NoticeStatus } from '../../libs/enums/notice.enum';

@Injectable()
export class NoticeService {
	constructor(@InjectModel('Notice') private readonly noticeModel: Model<Notice>) {}

	public async createNoticeByAdmin(memberId: ObjectId, input: NoticeInput): Promise<Notice> {
		try {
			return await this.noticeModel.create({ ...input, memberId });
		} catch (err) {
			throw new BadGatewayException(Message.CREATE_FAILED);
		}
	}

	public async createInquiry(memberId: ObjectId, input: InquiryInput): Promise<Notice> {
		try {
			return await this.noticeModel.create({
				...input,
				memberId,
				noticeCategory: NoticeCategory.INQUIRY,
				noticeStatus: NoticeStatus.HOLD,
			});
		} catch (err) {
			throw new BadGatewayException(Message.CREATE_FAILED);
		}
	}

	public async getNotices(input: PublicNoticesInquiry): Promise<Notices> {
		if (![NoticeCategory.NOTICE, NoticeCategory.FAQ].includes(input.noticeCategory))
			throw new BadRequestException(Message.BAD_REQUEST);
		return this.listNotices(
			{ noticeCategory: input.noticeCategory, noticeStatus: NoticeStatus.ACTIVE },
			input.page,
			input.limit,
			{ createdAt: Direction.DESC, _id: Direction.DESC },
		);
	}

	public async getMyInquiries(memberId: ObjectId, input: InquiriesInquiry): Promise<Notices> {
		return this.listNotices(
			{ noticeCategory: NoticeCategory.INQUIRY, memberId },
			input.page,
			input.limit,
			{ createdAt: Direction.DESC, _id: Direction.DESC },
		);
	}

	public async getAllNoticesByAdmin(input: AllNoticesInquiry): Promise<Notices> {
		const { noticeCategory, noticeStatus, text } = input.search;
		const match: T = {};
		const sort: T = {
			[input.sort ?? 'createdAt']: input.direction ?? Direction.DESC,
			_id: input.direction ?? Direction.DESC,
		};
		if (noticeCategory) match.noticeCategory = noticeCategory;
		if (noticeStatus) match.noticeStatus = noticeStatus;
		if (text?.trim())
			match.noticeTitle = { $regex: new RegExp(text.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i') };

		return this.listNotices(match, input.page, input.limit, sort);
	}

	private async listNotices(match: T, page: number, limit: number, sort: T): Promise<Notices> {
		const result = await this.noticeModel
			.aggregate([
				{ $match: match },
				{ $sort: sort },
				{
					$facet: {
						list: [
							{ $skip: (page - 1) * limit },
							{ $limit: limit },
							lookupMember,
							{ $unwind: { path: '$memberData', preserveNullAndEmptyArrays: true } },
						],
						metaCounter: [{ $count: 'total' }],
					},
				},
			])
			.exec();
		if (!result.length) throw new InternalServerErrorException(Message.NO_DATA_FOUND);
		return result[0];
	}
	public async updateNoticeByAdmin(input: NoticeUpdate): Promise<Notice> {
		const { _id, ...update } = input;
		const result = await this.noticeModel
			.findOneAndUpdate(
				{ _id, noticeStatus: { $in: [NoticeStatus.ACTIVE, NoticeStatus.HOLD] } },
				{ $set: update },
				{ new: true, runValidators: true },
			)
			.exec();
		if (!result) throw new InternalServerErrorException(Message.UPDATE_FAILED);
		return result;
	}
	public async removeNoticeByAdmin(noticeId: ObjectId): Promise<Notice> {
		const result = await this.noticeModel.findOneAndDelete({ _id: noticeId, noticeStatus: NoticeStatus.DELETE }).exec();
		if (!result) throw new InternalServerErrorException(Message.REMOVE_FAILED);
		return result;
	}
}
