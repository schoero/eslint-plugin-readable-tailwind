import { exec } from 'node:child_process'

export async function $(
    command: TemplateStringsArray,
    ...values: (boolean | number | string)[]
): Promise<string | Buffer> {
    return new Promise((resolve, reject) => {
        exec(String.raw(command, ...values), (error, stdout, stderr) => {
            if (error && stderr) {
                console.error(error, stderr)
                reject(error)
            }
            resolve(stdout || stderr)
        })
    })
}
