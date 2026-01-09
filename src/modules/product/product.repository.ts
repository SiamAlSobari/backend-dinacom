import type { ProductUnitEnum } from "../../common/enums/product.js";
import { prisma } from "../../common/utils/db.js";

export class ProductRepository {

    public async create(businessId: string,imageUrl: string, name: string, unit: ProductUnitEnum, stock: number, price: number) {
        return await prisma.products.create({ 
            data: {
                business_id: businessId,
                name,
                unit,
                image_url: imageUrl,
                price,
                stocks: {
                    create: {
                        stock_on_hand: stock
                    }
                }
            }
        });
    }

    public async update(productId: string, imageUrl: string, name: string, unit: ProductUnitEnum) {
        return await prisma.products.update({ 
            where: {
                id: productId,
                deleted_at: null
            },
            data: {
                name,
                unit,
                image_url: imageUrl
            }
        });
    }

    public async getProduct(productId: string) {
        return await prisma.products.findFirst({ 
            where: {
                id: productId,
                deleted_at: null
            },
            include: {
                stocks: {
                    where: {
                        deleted_at: null
                    }
                }
            }
        });
    }

    public async getProducts(businessId: string, search: string) {
        return await prisma.products.findMany({ 
            where: {
                business_id: businessId,
                deleted_at: null,
                stocks: {
                    some: {
                        deleted_at: null
                    }
                },
                name: {
                    contains: search
                }
            },
            include: {
                stocks: {
                    where: {
                        deleted_at: null
                    }
                }
            }
        });
    }

    public async softDelete(productId: string) {
        return await prisma.products.update({ 
            where: {
                id: productId,
                deleted_at: null
            },
            data: {
                deleted_at: new Date()
            }
        });
    }

    
}