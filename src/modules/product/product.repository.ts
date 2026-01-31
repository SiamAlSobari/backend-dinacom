import type { ProductUnitEnum } from "../../common/enums/product.js";
import { prisma } from "../../common/utils/db.js";

export class ProductRepository {

    public async create(businessId: string, imageUrl: string, name: string, unit: ProductUnitEnum, stock: number, price: number) {
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

    public async getAllProductsPaginated(businessId: string, page: number, limit: number) {
        const offset = (page - 1) * limit;
        const maxPage = Math.ceil(await prisma.products.count({
            where: {
                business_id: businessId,
                deleted_at: null,
                stocks: {
                    some: {
                        deleted_at: null
                    }
                }
            }
        }) / limit);
        const products = await prisma.products.findMany({
            where: {
                business_id: businessId,
                deleted_at: null,
                stocks: {
                    some: {
                        deleted_at: null
                    }
                }
            },
            include: {
                stocks: {
                    where: {
                        deleted_at: null
                    }
                }
            },
            take: limit,
            skip: offset
        });
        return { products, maxPage }
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

    public async getProductsByBusiness(businessId: string) {
        return await prisma.products.findMany({
            where: {
                business_id: businessId,
                deleted_at: null,
            },
            include: {
                stocks: {
                    where: { deleted_at: null },
                    select: { stock_on_hand: true },
                },
            },
        });
    }

    async findProductSummaryRaw(businessId: string, sevenDaysAgo: Date) {
        return prisma.products.findMany({
            where: {
                business_id: businessId,
                deleted_at: null,
            },
            include: {
                stocks: {
                    where: { deleted_at: null },
                    select: { stock_on_hand: true },
                },
                transaction_items: {
                    where: {
                        deleted_at: null,
                        transaction: {
                            trx_type: "SALE",
                            trx_date: {
                                gte: sevenDaysAgo,
                            },
                        },
                    },
                    select: {
                        quantity: true,
                    },
                },
            },
        })
    }

}