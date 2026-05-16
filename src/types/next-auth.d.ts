// src/types/next-auth.d.ts
import NextAuth from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      email: string;
      name: string;
      role: string;
      firstName: string;
      lastName: string;
      employeeId: string;
    };
  }

  interface User {
    role: string;
    firstName: string;
    lastName: string;
    employeeId: string;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    role: string;
    firstName: string;
    lastName: string;
    employeeId: string;
  }
}