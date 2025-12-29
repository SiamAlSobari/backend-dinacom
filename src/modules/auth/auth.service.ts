import { jwtSeccret } from "../../common/utils/env.js";
import { comparePassword, hashPassword } from "../../common/utils/hash.js";
import { generateToken } from "../../common/utils/jwt.js";
import type { UserRepository } from "../user/user.repository.js";
import {
    HTTPException
} from 'hono/http-exception'


export class AuthService {

    constructor(
        private readonly userRepository: UserRepository
    ) { }

    public async register(name: string, email: string, password: string) {
        // cek user ada atau tidak
        const existingUser = await this.userRepository.findByEmail(email)
        if (existingUser) throw new HTTPException(409, { message: "User sudah terdaftar" })

        // Convert pasword ke hash
        const hashedPassword = await hashPassword(password)

        // Create user jika valid
        const create = await this.userRepository.create(name, email, hashedPassword)
        if (!create) throw new HTTPException(400, { message: "Gagal membuat user" })

        return create
    }


    public async login(email: string, password: string) {
        // Cek user ada atau tidak
        const user = await this.userRepository.findByEmail(email)
        if (!user) throw new HTTPException(404, { message: "User tidak di temukan" })

        // Kalo user ada compare password lalu cek bener atau tidak
        const isValidPassword = comparePassword(password, user.password)
        if (!isValidPassword) throw new HTTPException(400, { message: "Pasowrd anda salah" })

        // Masukin payload dan generate jwt token
        const payload = { id: user.id, email: user.email };
        const token = await generateToken(payload, jwtSeccret);
        return token;
    }
}