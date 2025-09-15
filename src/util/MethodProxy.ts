export type MethodInterceptor = (
    name: string,
    args: any[],
    originalMethod: (...args: any[]) => unknown
) => unknown;
export function methodProxy<ClassType extends new (...args: any) => any>(
    cls: ClassType,
    instance: InstanceType<ClassType>,
    interceptor: MethodInterceptor
): InstanceType<ClassType> {
    const handler = {
        get(target: InstanceType<ClassType>, prop: string, receiver: any) {
            const original = Reflect.get(target, prop, receiver);
            if (
                prop in cls.prototype &&
                typeof cls.prototype[prop] === "function" &&
                prop !== "constructor"
            ) {
                return (...args: any[]) => interceptor(prop, args, original);
            } else {
                return original;
            }
        },
    };
    return new Proxy(instance, handler);
}
