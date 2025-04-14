export const fine = {
  table: () => ({
    select: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    insert: jest.fn().mockResolvedValue(undefined)
  })
};