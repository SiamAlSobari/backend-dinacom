import type { SetStockItem } from "../../common/interfaces/stock.js";
import type { StockRepository } from "./stock.repository.js";

export class StockService {
    constructor(
        private readonly stockRepository : StockRepository
    ) {}

    public async setStock(businessId: string, items: SetStockItem[]) {
        return await this.stockRepository.setStock(businessId, items)
    }
}