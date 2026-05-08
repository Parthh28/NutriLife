import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';
import * as jwt from 'jsonwebtoken';

const prisma = new PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET!;
if (!process.env.JWT_SECRET) {
  throw new Error('JWT_SECRET is not defined in environment variables');
}

export class AuthService {
  static async signup(email: string, password: string, name?: string) {
    try {
      const hashedPassword = await bcrypt.hash(password, 10);
      const user = await prisma.user.create({
        data: {
          email,
          password: hashedPassword,
          name,
        },
      });
      return AuthService.generateToken(user);
    } catch (error: any) {
      console.error('Signup Error:', error);
      throw new Error(error.code === 'P2002' ? 'Email already registered' : 'Registration failed. Please try again.');
    }
  }

  static async login(email: string, password: string) {
    try {
      const user = await prisma.user.findUnique({
        where: { email },
      });

      if (!user) {
        throw new Error('Invalid credentials');
      }

      const isPasswordValid = await bcrypt.compare(password, user.password);
      if (!isPasswordValid) {
        throw new Error('Invalid credentials');
      }

      return AuthService.generateToken(user);
    } catch (error: any) {
      console.error('Login Error:', error);
      throw error;
    }
  }

  static async resetPassword(email: string, newPass: string) {
    try {
      const hashedPassword = await bcrypt.hash(newPass, 10);
      await prisma.user.update({
        where: { email },
        data: { password: hashedPassword }
      });
      return { message: 'Password updated successfully' };
    } catch (error: any) {
      console.error('Reset Password Error:', error);
      throw new Error('Could not reset password. User might not exist.');
    }
  }

  private static generateToken(user: any) {
    const token = jwt.sign(
      { userId: user.id, email: user.email },
      JWT_SECRET,
      { expiresIn: '7d' }
    );
    return {
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        age: user.age,
        weight: user.weight,
        height: user.height,
        gender: user.gender,
        activityLevel: user.activityLevel,
        goal: user.goal,
        dailyCalories: user.dailyCalories,
        macroSplit: user.macroSplit,
        hydrationGoal: user.hydrationGoal,
        fiberGoal: user.fiberGoal
      },
    };
  }

  static async updateProfile(userId: string, data: any) {
    return await prisma.user.update({
      where: { id: userId },
      data: {
        dailyCalories: data.dailyCalories,
        macroSplit: data.macroSplit,
        age: data.age,
        weight: data.weight,
        height: data.height,
        gender: data.gender,
        activityLevel: data.activityLevel,
        goal: data.goal,
        hydrationGoal: data.hydrationGoal,
        fiberGoal: data.fiberGoal
      }
    });
  }
}

