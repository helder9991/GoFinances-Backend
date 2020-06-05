import { getCustomRepository, getRepository } from 'typeorm';
import AppError from '../errors/AppError';

import Transaction from '../models/Transaction';
import Category from '../models/Category';
import TransactionRepository from '../repositories/TransactionsRepository';

interface Request {
  title: string;
  value: number;
  type: 'income' | 'outcome';
  category: 'string';
}

class CreateTransactionService {
  public async execute({
    title,
    value,
    type,
    category,
  }: Request): Promise<Transaction> {
    const transactionRepository = getCustomRepository(TransactionRepository);

    if (type === 'outcome') {
      const transactions = await transactionRepository.find();
      const balance = await transactionRepository.getBalance(transactions);

      if (balance.total - value < 0)
        throw new AppError('Invalid transition, negative balance', 400);
    }

    const categoryRepository = getRepository(Category);

    const categoryExists = await categoryRepository.findOne({
      where: { title: category },
    });

    let category_id = categoryExists ? categoryExists.id : '';

    if (!categoryExists) {
      const newCategory = await categoryRepository.create({
        title: category,
      });

      const createdCategory = await categoryRepository.save(newCategory);
      category_id = createdCategory.id;
    }

    const transaction = transactionRepository.create({
      title,
      value,
      type,
      category_id,
    });

    await transactionRepository.save(transaction);

    return transaction;
  }
}

export default CreateTransactionService;
