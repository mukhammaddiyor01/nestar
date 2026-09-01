import { Injectable } from '@nestjs/common';
import LikeSchema from '../../schemas/Like.model';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Like } from '../../libs/dto/like/like';
import { AuthService } from '../auth/auth.service';

@Injectable()
export class LikeService {
	constructor(
		@InjectModel('Like') private readonly LikeModel: Model<Like>,
		private authService: AuthService,
	) {}
}
