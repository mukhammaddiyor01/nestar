import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, ObjectId } from 'mongoose';
import { AuthService } from '../auth/auth.service';
import { Follower, Following } from '../../libs/dto/follow/follow';
import { MemberService } from '../member/member.service';

@Injectable()
export class FollowService {
	constructor(
		@InjectModel('Follow') private readonly followModel: Model<Follower | Following>,
		private readonly MemberService: MemberService,
		private authService: AuthService,
	) {}
}
