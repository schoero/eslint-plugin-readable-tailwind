export type RequiredByKey<ObjectType, Key extends keyof ObjectType> = Omit<ObjectType, Key> & Required<Pick<ObjectType, Key>>;
