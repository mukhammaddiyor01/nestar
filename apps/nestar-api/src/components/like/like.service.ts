import { BadRequestException, Injectable } from '@nestjs/common';
import LikeSchema from '../../schemas/Like.model';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Like, MeLiked } from '../../libs/dto/like/like';
import { AuthService } from '../auth/auth.service';
import { LikeInput } from '../../libs/dto/like/like.input';
import { T } from '../../libs/types/common';
import { Message } from '../../libs/enums/common.enum';

@Injectable()
export class LikeService {
	constructor(
		@InjectModel('Like') private readonly likeModel: Model<Like>,
		private authService: AuthService,
	) {}

	public async toggleLike(input: LikeInput): Promise<number> {
		const search: T = {
			memberId: input.memberId,
			likeRefId: input.likeRefId,
		};

		const exist = await this.likeModel.findOne(search).exec();
		let modifier: number;

		if (exist) {
			await this.likeModel.findOneAndDelete(search).exec();
			modifier = -1;
		} else {
			try {
				await this.likeModel.create(input);
				modifier = 1;
			} catch (err) {
				//@ts-ignore
				console.log('ERROR, Service.model', err.message);
				throw new BadRequestException(Message.CREATE_FAILED);
			}
		}

		console.log(`- Like modifier ${modifier} -`);
		return modifier;
	}

	public async checkLikeExistence(input: LikeInput): Promise<MeLiked[]> {
		const { memberId, likeRefId } = input;
		const result = await this.likeModel.findOne({ memberId: memberId, likeRefId: likeRefId }).exec();
		return result ? [{ memberId: memberId, likeRefId: likeRefId, myFavorite: true }] : [];
		return [];
	}
}
