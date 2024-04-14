import { HttpStatus, Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { RpcException } from '@nestjs/microservices';

import { PrismaClient } from '@prisma/client';

import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';

import { PaginationDto } from 'src/common';

@Injectable()
export class ProductsService extends PrismaClient implements OnModuleInit {
  private readonly logger = new Logger('ProductsService');
  onModuleInit() {
    this.$connect();
    this.logger.log(`Database connected`);
  }

  create(createProductDto: CreateProductDto) {
    return this.product.create({ data: createProductDto });
  }

  async findAll({ page, limit }: PaginationDto) {
    const total = await this.product.count({
      where: {
        available: true,
      },
    });
    const lastPage = Math.ceil(total / limit);

    return {
      data: await this.product.findMany({
        where: {
          available: true,
        },
        skip: (page - 1) * limit,
        take: limit,
      }),
      meta: {
        page,
        total,
        lastPage,
      },
    };
  }

  async findById(id: number) {
    const product = await this.product.findFirst({
      where: {
        id,
        available: true,
      },
    });

    if (!product)
      throw new RpcException({
        message: `Product with id #${id} not found`,
        status: HttpStatus.BAD_REQUEST,
      });

    return product;
  }

  async update(id: number, { id: __, ...updateProductDto }: UpdateProductDto) {
    await this.findById(id);

    return this.product.update({
      where: {
        id,
      },
      data: updateProductDto,
    });
  }

  async delete(id: number) {
    await this.findById(id);

    return await this.product.update({
      where: { id },
      data: {
        available: false,
      },
    });
  }

  async validateProduct(ids: number[]) {
    // return ids;
    ids = Array.from(new Set(ids));

    const products = await this.product.findMany({
      where: {
        id: {
          in: ids,
        },
      },
    });

    if (products.length !== ids.length)
      throw new RpcException({
        message: `Some products were not found`,
        status: HttpStatus.BAD_REQUEST,
      });

    return products;
  }
}
