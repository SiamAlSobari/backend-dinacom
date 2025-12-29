import { prisma } from "../../common/utils/db.js";

export class UserRepository {
    public async create(name: string, email: string, hashPassword: string) {
        return await prisma.users.create({
            data: {
                email,
                name,
                password:hashPassword
            }
        })
    }

    public async findByEmail(email: string){
        return await prisma.users.findFirst({
            where: {
                email,
                deleted_at: null
            }
        })
    }
}