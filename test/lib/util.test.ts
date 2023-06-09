import { objMap } from '../../src/lib/util';

test('objMap works', () => {
  const colors = { red: 'FF0000', green: '00FF00', blue: '0000FF' };
  const output = objMap(colors, (_, value) => `#${value}`);
  expect(output).toEqual({ red: '#FF0000', green: '#00FF00', blue: '#0000FF' });
});
