import { Injectable } from '@nestjs/common';
import * as bycrypt from 'bcryptjs';

@Injectable()
export class AuthService {
	public async hashPassword(memberPassword: string): Promise<string> {
		const salt = await bycrypt.genSalt();
		return await bycrypt.hash(memberPassword, salt);
	}

	public async comparePassword(password: string, hashedPassword: string): Promise<string> {
		return await bycrypt.compare(password, hashedPassword);
	}
}
