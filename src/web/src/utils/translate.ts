
const getLastDigits = (count: number, divider: number) => {
    const lastTwoDigits = count % divider;
    return lastTwoDigits;
}

export const getCountType = (count: number) => {
    const twoDigits = getLastDigits(count, 100);

    if ([11, 12, 13, 14].find(x => x === twoDigits)) return 4;

    const oneDigit = getLastDigits(count, 10);

    if ([2, 3, 4].find(x => x === oneDigit)) return 3;

    if (oneDigit === 1) return 2;

    if (count === 0) return 1;

    return 5;
}