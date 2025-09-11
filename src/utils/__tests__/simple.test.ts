// Simple test to verify Jest setup is working
describe('Jest Setup', () => {
  it('should run tests correctly', () => {
    expect(1 + 1).toBe(2);
  });

  it('should handle basic TypeScript', () => {
    const message: string = 'Hello Test';
    expect(message).toBe('Hello Test');
  });

  it('should mock functions', () => {
    const mockFn = jest.fn();
    mockFn('test');
    expect(mockFn).toHaveBeenCalledWith('test');
  });
});