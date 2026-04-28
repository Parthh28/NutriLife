import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export class BlogService {
  static async getAllBlogs() {
    return await prisma.blog.findMany({
      include: {
        _count: {
          select: { likes: true }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });
  }

  static async createBlog(data: any) {
    return await prisma.blog.create({
      data: {
        title: data.title,
        category: data.category,
        author: data.author,
        readTime: data.readTime,
        excerpt: data.excerpt,
        content: data.content,
        image: data.image
      }
    });
  }

  static async toggleLike(blogId: string, userId?: string) {
    // If userId is provided, we can check if they already liked it
    // For now, let's just create a new like entry to increment the count
    // (A more robust system would toggle it)
    
    return await prisma.like.create({
      data: {
        blogId,
        userId
      }
    });
  }

  static async getLikesCount(blogId: string) {
    return await prisma.like.count({
      where: { blogId }
    });
  }
}
