import { HTTPException } from "hono/http-exception";
import type { BusinessRepository } from "./business.repository.js";

export class BusinessService {
    constructor(
        private readonly businessRepository: BusinessRepository
    ) { }

    public async createBusiness(userId: string, name: string) {
        // cek business ada atau tidak
        const existingBusiness = await this.businessRepository.get(userId)
        if (existingBusiness) throw new HTTPException(400, { message: "Gagal membuat business" })

        // Buat business
        const business = await this.businessRepository.create(userId, name)
        if (!business) throw new HTTPException(400, { message: "Gagal membuat business" })

        return business
    }

    public async getBusiness(userId: string) {
        return await this.businessRepository.get(userId)
    }

    public async delete(userId: string, businessId: string) {
        // cek business ada atau tidak
        const existingBusiness = await this.businessRepository.get(userId)
        if (!existingBusiness) throw new HTTPException(400, { message: "Gagal membuat business" })
        
        // Hapus business
        const business = await this.businessRepository.softDelete(businessId,userId)
        if (!business) throw new HTTPException(400, { message: "Gagal menghapus business" })
            
        return business
    }
}