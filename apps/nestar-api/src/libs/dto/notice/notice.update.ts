import { Field, InputType } from '@nestjs/graphql';
import { Transform } from 'class-transformer';
import { IsEnum, IsMongoId, Length, ValidateIf } from 'class-validator';
import { ObjectId } from 'mongoose';
import { NoticeStatus } from '../../enums/notice.enum';

@InputType()
export class NoticeUpdate {
	@IsMongoId()
	@Field(() => String)
	_id: ObjectId;

	@ValidateIf((object, value) => value !== undefined)
	@IsEnum(NoticeStatus)
	@Field(() => NoticeStatus, { nullable: true })
	noticeStatus?: NoticeStatus;

	@ValidateIf((object, value) => value !== undefined)
	@Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
	@Length(3, 100)
	@Field(() => String, { nullable: true })
	noticeTitle?: string;

	@ValidateIf((object, value) => value !== undefined)
	@Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
	@Length(3, 10000)
	@Field(() => String, { nullable: true })
	noticeContent?: string;

	@ValidateIf((object, value) => value !== undefined)
	@Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
	@Length(3, 10000)
	@Field(() => String, { nullable: true })
	noticeAnswer?: string;
}
