import { inject, injectable } from 'tsyringe';

import AppError from '@shared/errors/AppError';

import IProductsRepository from '@modules/products/repositories/IProductsRepository';
import ICustomersRepository from '@modules/customers/repositories/ICustomersRepository';
import Order from '../infra/typeorm/entities/Order';
import IOrdersRepository from '../repositories/IOrdersRepository';

interface IProduct {
  id: string;
  quantity: number;
}

interface IRequest {
  customer_id: string;
  products: IProduct[];
}

@injectable()
class CreateOrderService {
  constructor(
    @inject('OrdersRepository')
    private ordersRepository: IOrdersRepository,

    @inject('ProductsRepository')
    private productsRepository: IProductsRepository,

    @inject('CustomersRepository')
    private customersRepository: ICustomersRepository,
  ) {}

  public async execute({ customer_id, products }: IRequest): Promise<Order> {
    // TODO
    const customerExists = await this.customersRepository.findById(customer_id);

    if (!customerExists) {
      throw new AppError('Customer does not exist on database');
    }

    const productSearch = await this.productsRepository.findAllById(products);

    if (!productSearch.length) {
      throw new AppError('Could not find the products');
    }

    const productSearchIds = productSearch.map(p => p.id);

    const checkInexistentProducts = products.filter(
      p => !productSearchIds.includes(p.id),
    );

    if (checkInexistentProducts.length) {
      checkInexistentProducts.forEach(p => {
        throw new AppError(`The product ${p} does not exist on database`);
      });
    }

    const outOfStockProducts = products.filter(
      product =>
        productSearch.filter(p => p.id === product.id)[0].quantity <
        product.quantity,
    );

    if (outOfStockProducts.length) {
      outOfStockProducts.forEach(p => {
        throw new AppError(
          `The product ${p} does not have the requested quantity in stock`,
        );
      });
    }

    const formattedProducts = products.map(p => ({
      product_id: p.id,
      quantity: p.quantity,
      price: productSearch.filter(s => s.id === p.id)[0].price,
    }));

    const order = await this.ordersRepository.create({
      customer: customerExists,
      products: formattedProducts,
    });

    const orderedProductsQuantity = products.map(o => ({
      id: o.id,
      quantity:
        productSearch.filter(p => p.id === o.id)[0].quantity - o.quantity,
    }));

    await this.productsRepository.updateQuantity(orderedProductsQuantity);

    return order;
  }
}

export default CreateOrderService;
