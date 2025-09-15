import { expect } from "chai";
import { methodProxy } from "../../src/util/MethodProxy";

describe("MethodProxy", () => {
    it("should proxy methods", () => {
        const numberMap = new Map<string, number>();
        numberMap.set("one", 1);
        numberMap.set("two", 2);
        numberMap.set("three", 3);

        const plusOneMap = methodProxy(
            Map,
            numberMap,
            (name, args, originalMethod) => {
                const originalResult = originalMethod.apply(numberMap, args);
                if (name === "get") {
                    return originalResult + 1;
                } else {
                    return originalResult;
                }
            }
        );

        expect(plusOneMap instanceof Map).to.be.true;
        expect(plusOneMap.constructor).to.be.equal(Map);

        expect(plusOneMap.get("one")).to.be.equal(2);
        expect(plusOneMap.get("two")).to.be.equal(3);
        expect(plusOneMap.get("three")).to.be.equal(4);
    });
});
