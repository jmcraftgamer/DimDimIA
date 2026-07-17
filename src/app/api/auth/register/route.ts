import { NextRequest, NextResponse } from 'next/server'
import { hash } from 'bcrypt'
import prisma from '../../../../lib/prisma'

export async function POST(request: NextRequest) {
  try {
    const { name, email, password } = await request.json()

    if (!email || !password) {
      return NextResponse.json({ error: 'Email e senha são obrigatórios' }, { status: 400 })
    }

    if (password.length < 6) {
      return NextResponse.json({ error: 'Senha deve ter no mínimo 6 caracteres' }, { status: 400 })
    }

    const existing = await prisma.user.findUnique({ where: { email } })
    if (existing) {
      return NextResponse.json({ error: 'Email já cadastrado' }, { status: 400 })
    }

    const hashedPassword = await hash(password, 10)

    const user = await prisma.user.create({
      data: {
        name: name || email.split('@')[0],
        email,
        password: hashedPassword,
      },
    })

    return NextResponse.json({
      user: { id: user.id, name: user.name, email: user.email },
    })
  } catch (error: any) {
    console.error('Register error:', error)
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
}
