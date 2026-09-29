import { act, render } from '@testing-library/react';
import Reveal from './Reveal';

const observers = [];

class MockIntersectionObserver {
  constructor(callback, options) {
    this.callback = callback;
    this.options = options;
    this.observe = jest.fn();
    this.unobserve = jest.fn();
    this.disconnect = jest.fn();
    observers.push(this);
  }
}

beforeAll(() => {
  window.IntersectionObserver = MockIntersectionObserver;
});

afterAll(() => {
  delete window.IntersectionObserver;
});

test('once reveals stay complete and stop observing after their first entrance', () => {
  const { container } = render(<Reveal once>Project workspace</Reveal>);
  const element = container.firstChild;

  const observer = observers[0];
  act(() => observer.callback([{ target: element, isIntersecting: true }]));

  expect(element).toHaveClass('is-visible');
  expect(observer.unobserve).toHaveBeenCalledWith(element);

  act(() => observer.callback([{ target: element, isIntersecting: false }]));
  expect(element).toHaveClass('is-visible');
});

test('standard reveals remain reversible', () => {
  const { container } = render(<Reveal threshold={0.3}>Project title</Reveal>);
  const element = container.firstChild;
  const observer = observers[1];

  act(() => observer.callback([{ target: element, isIntersecting: true }]));
  expect(element).toHaveClass('is-visible');

  act(() => observer.callback([{ target: element, isIntersecting: false }]));
  expect(element).not.toHaveClass('is-visible');
});

test('reset-on-exit reveals use entrance hysteresis without threshold flicker', () => {
  const { container } = render(
    <Reveal threshold={0.3} resetOnExit>Project workspace</Reveal>
  );
  const element = container.firstChild;
  const observer = observers[2];

  expect(observer.options.threshold).toEqual([0.0001, 0.3]);

  act(() => observer.callback([{ target: element, isIntersecting: true, intersectionRatio: 0.05 }]));
  expect(element).not.toHaveClass('is-visible');

  act(() => observer.callback([{ target: element, isIntersecting: true, intersectionRatio: 0.3 }]));
  expect(element).toHaveClass('is-visible');

  act(() => observer.callback([{ target: element, isIntersecting: true, intersectionRatio: 0.1 }]));
  expect(element).toHaveClass('is-visible');

  act(() => observer.callback([{ target: element, isIntersecting: true, intersectionRatio: 0.00005 }]));
  expect(element).not.toHaveClass('is-visible');

  act(() => observer.callback([{ target: element, isIntersecting: true, intersectionRatio: 0.3 }]));
  expect(element).toHaveClass('is-visible');

  act(() => observer.callback([{ target: element, isIntersecting: false, intersectionRatio: 0 }]));
  expect(element).not.toHaveClass('is-visible');
});
