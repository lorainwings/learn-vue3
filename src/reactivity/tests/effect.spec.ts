import { reactive } from "../reactive"
import { effect, stop } from "../effect"


describe('effect', () => {
  it('happy path', () => {
    const user = reactive({
      age: 10
    })

    let nextAge;
    effect(() => {
      // 触发get陷阱函数
      nextAge = user.age + 1
    })

    expect(nextAge).toBe(11)

    user.age++;
    expect(nextAge).toBe(12)
  })

  it('call effect should return runner', () => {
    // 1.  effect(fn) -> function runner() -> fn -> return fn返回值
    let foo = 10;
    const runner = effect(() => {
      foo++
      return 'foo'
    });

    expect(foo).toBe(11)
    const r = runner()
    expect(foo).toBe(12)
    expect(r).toBe('foo')
  })

  it("scheduler", () => {
    let dummy;
    let run: any;
    const scheduler = jest.fn(() => {
      run = runner;
    });
    const obj = reactive({ foo: 1 });
    const runner = effect(
      () => {
        dummy = obj.foo;
      },
      { scheduler }
    );
    expect(scheduler).not.toHaveBeenCalled();
    expect(dummy).toBe(1);
    // should be called on first trigger
    obj.foo++;
    expect(scheduler).toHaveBeenCalledTimes(1);
    // // should not run yet
    expect(dummy).toBe(1);
    // // manually run
    run();
    // // should have run
    expect(dummy).toBe(2);
  });


  it("stop", () => {
    let dummy, dummy1;
    const obj = reactive({ a: 1, b: 2 });
    const runner = effect(() => {
      dummy = obj.a;
      dummy1 = obj.b
    });
    obj.a = 2
    obj.b = 3

    expect(dummy).toBe(2);
    expect(dummy1).toBe(3);

    stop(runner);
    // 使用自增语法,等同于 obj.a = obj.a + 1, 会导致多收集一次依赖
    // 上一步虽然已经清理, 但这里又添加了一次依赖, 因此还需优化obj.a++的场景
    // obj.a++
    obj.a = 3
    obj.b = 4

    expect(dummy).toBe(2);
    expect(dummy1).toBe(3);

    // stopped effect should still be manually callable
    runner();

    expect(dummy).toBe(3);
    expect(dummy1).toBe(4);
  });


  it('onStop', () => {
    let dummy;
    const obj = reactive({ foo: 1 })
    const onStop = jest.fn()
    const runner = effect(() => {
      dummy = obj.foo
    }, { onStop })
    stop(runner)
    expect(onStop).toBeCalledTimes(1)
  })
})
