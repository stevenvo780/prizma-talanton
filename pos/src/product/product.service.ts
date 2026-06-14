import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Product } from './entities/product.entity';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { Invoice } from '../invoice/entities/invoice.entity';
import { User } from '../user/entities/user.entity';

@Injectable()
export class ProductService {
  constructor(
    @InjectRepository(Product)
    private productRepository: Repository<Product>,
    @InjectRepository(Invoice)
    private invoiceRepository: Repository<Invoice>,
  ) {}

  async search(
    query: {
      categoryId?: number;
      name?: string;
      priceTypeId?: number;
    },
    userId: string,
  ) {
    const { categoryId, name, priceTypeId } = query;
    const products = await this.productRepository
      .createQueryBuilder('product')
      .leftJoinAndSelect('product.categories', 'category')
      .where('product.user.id = :userId', { userId });
    if (name) {
      products.andWhere('to_tsvector(product.name) @@ to_tsquery(:name)', {
        name: `${name}:*`,
      });
    }

    if (categoryId) {
      products.andWhere('category.id = :categoryId', { categoryId });
    }

    let getProducts = await products.getMany();
    if (priceTypeId) {
      getProducts = getProducts.filter((product) => {
        const priceTypes = product.priceTypes.filter(
          (priceType) =>
            priceType.category && priceType.category.id == +priceTypeId,
        );
        return priceTypes.length > 0;
      });
    }
    return getProducts;
  }

  async findByQuery(query: string, userId: string) {
    if (query === '') return this.productRepository.find({});
    return this.productRepository
      .createQueryBuilder('product')
      .leftJoin(
        'product.categories',
        'category',
        'category.name ILike :query',
        { query: `%${query}%` },
      )
      .where('product.user.id = :userId', { userId })
      .andWhere('to_tsvector(product.name) @@ to_tsquery(:query)', {
        query: `${query}:*`,
      })
      .orWhere(
        "product.user.id = :userId AND EXISTS (SELECT 1 FROM json_array_elements(product.priceTypes) AS j(price) WHERE to_tsvector(CAST(price->>'price' AS TEXT)) @@ to_tsquery(:query))",
        {
          userId,
          query: `${query}:*`,
        },
      )
      .getMany();
  }

  async create(createProductDto: CreateProductDto, user: User) {
    try {
      const product = new Product();
      Object.assign(product, createProductDto);
      product.user = user;
      return await this.productRepository.save(product);
    } catch (error) {
      console.error(error);
      throw new Error(error);
    }
  }

  async findAll(userId: string) {
    const invoices = await this.invoiceRepository
      .createQueryBuilder('invoice')
      .where('invoice.user = :userId', { userId })
      .getMany();
    const productCounts = {};
    for (const invoice of invoices) {
      for (const item of invoice.invoiceItems) {
        if (!productCounts[item.product.id]) {
          productCounts[item.product.id] = 0;
        }
        productCounts[item.product.id]++;
      }
    }
    let mostInvoicedProductId = null;
    let maxCount = 0;
    for (const productId in productCounts) {
      if (productCounts[productId] > maxCount) {
        mostInvoicedProductId = productId;
        maxCount = productCounts[productId];
      }
    }
    const products = await this.productRepository
      .createQueryBuilder('product')
      .leftJoinAndSelect('product.categories', 'category')
      .where('product.user = :userId', { userId })
      .orderBy('product.id = :productId', 'DESC')
      .addOrderBy('product.state', 'DESC')
      .setParameter('productId', mostInvoicedProductId)
      .getMany();
    return products;
  }

  findOne(id: number, userId: string) {
    return this.productRepository.findOne({
      where: { id, user: { id: userId } },
      relations: ['categories'],
    });
  }

  async update(id: number, updateProductDto: UpdateProductDto) {
    try {
      const product = await this.productRepository.findOne({
        where: { id },
      });
      if (!product) throw new Error('No se encontró el producto');
      if (updateProductDto.image == '') delete updateProductDto.image;
      Object.assign(product, updateProductDto);
      return this.productRepository.save(product);
    } catch (error) {
      console.error(error);
      throw new Error(error);
    }
  }

  remove(id: number) {
    try {
      return this.productRepository.delete(id);
    } catch (error) {
      console.error(error);
      throw new Error('No se puede borrar este producto');
    }
  }
}
