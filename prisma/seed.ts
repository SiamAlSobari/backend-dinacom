import { prisma } from "../src/common/utils/db.js";
import { hashPassword } from "../src/common/utils/hash.js";


async function main() {
  // Hash password
  const hashedPassword = await hashPassword('Rasya2121@');

  // Create user
  const user = await prisma.users.create({
    data: {
      name: 'Naufal Rasya',
      email: 'naufalrasya21907@gmail.com',
      password: hashedPassword,
    },
  });

  console.log('User created:', user.email);

  // Create business
  const business = await prisma.businesses.create({
    data: {
      user_id: user.id,
      name: 'Toko Rasya',
    },
  });

  console.log('Business created:', business.name);

  // Create products
  const products = await Promise.all([
    prisma.products.create({
      data: {
        business_id: business.id,
        name: 'Indomie Goreng',
        unit: 'PCS',
        price: 3500,
        is_active: true,
      },
    }),
    prisma.products.create({
      data: {
        business_id: business.id,
        name: 'Aqua 600ml',
        unit: 'PCS',
        price: 3000,
        is_active: true,
      },
    }),
    prisma.products.create({
      data: {
        business_id: business.id,
        name: 'Beras Premium',
        unit: 'KG',
        price: 15000,
        is_active: true,
      },
    }),
    prisma.products.create({
      data: {
        business_id: business.id,
        name: 'Minyak Goreng',
        unit: 'LITER',
        price: 18000,
        is_active: true,
      },
    }),
    prisma.products.create({
      data: {
        business_id: business.id,
        name: 'Gula Pasir',
        unit: 'KG',
        price: 14000,
        is_active: true,
      },
    }),
  ]);

  console.log(`${products.length} products created`);

  // Create stocks for products
  await Promise.all(
    products.map((product) =>
      prisma.stocks.create({
        data: {
          product_id: product.id,
          stock_on_hand: Math.floor(Math.random() * 100) + 50,
        },
      })
    )
  );

  console.log('Stocks created');

  // Create 100 transactions
  const transactions = [];
  const paymentMethods: Array<'CASH' | 'CREDIT' | 'DEBIT' | 'QRIS'> = ['CASH', 'CREDIT', 'DEBIT', 'QRIS'];
  const trxTypes: Array<'SALE' | 'PURCHASE'> = ['SALE', 'PURCHASE'];

  for (let i = 0; i < 100; i++) {
    const randomDate = new Date(
      Date.now() - Math.floor(Math.random() * 90) * 24 * 60 * 60 * 1000
    );

    const numItems = Math.floor(Math.random() * 3) + 1;
    const selectedProducts = [];
    for (let j = 0; j < numItems; j++) {
      selectedProducts.push(products[Math.floor(Math.random() * products.length)]);
    }

    let subtotal = 0;
    const items = selectedProducts.map((product) => {
      const quantity = Math.floor(Math.random() * 5) + 1;
      const linePrice = product.price * quantity;
      subtotal += linePrice;

      return {
        product_id: product.id,
        quantity,
        unit_price: product.price,
        line_price: linePrice,
      };
    });

    const discountAmount = Math.random() > 0.7 ? Math.floor(subtotal * 0.1) : 0;
    const totalAmount = subtotal - discountAmount;

    const transaction = await prisma.transactions.create({
      data: {
        business_id: business.id,
        trx_type: trxTypes[Math.floor(Math.random() * trxTypes.length)],
        trx_date: randomDate,
        payment_method: paymentMethods[Math.floor(Math.random() * paymentMethods.length)],
        paid_at: randomDate,
        total_amount: totalAmount,
        subtotal_amount: subtotal,
        discount_amount: discountAmount,
        transaction_items: {
          create: items,
        },
      },
    });

    transactions.push(transaction);
  }

  console.log(`${transactions.length} transactions created`);
  console.log('Seeding completed!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });