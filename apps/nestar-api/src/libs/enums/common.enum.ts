import { registerEnumType } from '@nestjs/graphql';

export enum Message {
	SOMETHING_WENT_WRONG = 'Something went wrong!',
	NO_DATA_FOUND = 'No data is found!',
	CREATE_FAILED = 'Create is failed!',
	UPDATE_FAILED = 'Update is failed!',
	REMOVE_FAILED = 'Remove failed!',
	BAD_REQUEST = 'Bad Request',

	USED_MEMBER_NICK_OR_PHONE = 'Already used member nick or phone!',
	USED_NICK_PHONE = 'You are inserting already used nick or phone!',
	TOKEN_CREATION_FAILED = 'Token creation error!',
	NO_MEMBER_NICK = 'no member with that member nick!',
	BLOCKED_USER = 'You have been blocked, contact Restaurnt!',
	WRONG_PASSWORD = 'Wrong password entered, please try again!',
	NOT_AUTHENTICATED = 'You are not authenticated, Please login first!',
	TOKEN_NOT_EXIST = 'Bearer Token is not provided',
	ONLY_SEPCIFIC_ROLES_ALLOWED = 'Allowed only for member with specific roles!',
	NOT_ALLOWED_REQUEST = 'Not Allowed Request!',
	PROVIDE_ALLOWED_FORMAT = 'Please provide jpg, jpeg or png images!',
	SELF_SUBSCRUPTION_DENIED = 'Self subscruption is denied!',
	UPLOAD_FAILED = 'UPLOAD_FAILED',
}

export enum Direction {
	ASC = 1,
	DESC = -1,
}

registerEnumType(Direction, {
	name: 'Direction',
});
