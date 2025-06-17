import { Request, Response, NextFunction } from 'express';

interface SampleData {
  id: number;
  name: string;
}

const getSampleData = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const data: SampleData = { id: 1, name: 'Sample' };
    res.json({ message: 'Hello from the API!', data });
    
  } catch (error) {
    next(error);
  }
};

export default {
  getSampleData,
};