import { hash } from "bcrypt";
import { compare } from "bcrypt";

export const hashPassword = async (password: string) => {
    const saltRounds = 10;
    const hashedPassword = await hash(password, saltRounds);
    return hashedPassword;
}


export const comparePassword = async (password: string, hashedPassword: string) => {
    const isPasswordValid = await compare(password, hashedPassword);
    return isPasswordValid;
}