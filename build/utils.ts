import { exec, type ExecOptions } from 'node:child_process'

export async function $(command: string, options?: ExecOptions): Promise<string | Buffer> {
    return new Promise((resolve, reject) => {
        exec(command, options, (error, stdout, stderr) => {
            if (error) {
                reject(error || stderr)
            }
            resolve(stdout)
        })
    })
}
