
import { PrismaClient } from '@prisma/client';

// Evitar múltiples instancias de PrismaClient en desarrollo debido al Hot Module Replacement (HMR)
declare global {
  // eslint-disable-next-line no-var
  var prisma: PrismaClient | undefined;
}

const prisma = global.prisma || new PrismaClient({
  // Puedes añadir opciones de log aquí si lo necesitas para debugging
  // log: ['query', 'info', 'warn', 'error'],
});

if (process.env.NODE_ENV === 'development') {
  global.prisma = prisma;
}

export default prisma;

    