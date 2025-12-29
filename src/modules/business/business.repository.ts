import { prisma } from "../../common/utils/db.js";

export class BusinessRepository {
    public async create(userId: string, name: string){
        return await prisma.businesses.create({
            data:{
                name,
                user_id: userId
            }
        })
    }

    public async get(userid: string){
        return await prisma.businesses.findFirst({
            where:{
                user_id: userid, 
                deleted_at: null
            }
        })
    }

    public async softDelete(businessId: string, userId:string){
        return await prisma.businesses.update({
            where:{
                id: businessId,
                deleted_at: null
            },
            data:{
                deleted_at: new Date()
            }
        })
    }
}