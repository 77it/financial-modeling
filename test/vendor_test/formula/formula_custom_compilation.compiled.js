export const expected1 = `
(function (__ctx) {
  "use strict";
  return __mathOps.add(
    1000000000000009998887776665554441234567890n,
    __ensure(__mathOps.mul(2005000000000n, 30000000000n)),
  );
});`;

export const expected6 = `
(function (__ctx) {
  "use strict";
  return __mathOps.mul(
    __ensure(
      __fns["avg"](
        __ctx && Object.prototype.hasOwnProperty.call(__ctx, "a")
          ? __ctx["a"]
          : (() => {
              throw new Error("Unknown reference " + "a");
            })(),
        __ctx && Object.prototype.hasOwnProperty.call(__ctx, "b")
          ? __ctx["b"]
          : (() => {
              throw new Error("Unknown reference " + "b");
            })(),
        __ctx && Object.prototype.hasOwnProperty.call(__ctx, "c")
          ? __ctx["c"]
          : (() => {
              throw new Error("Unknown reference " + "c");
            })(),
      ),
    ),
    1000000000000n,
  );
});`;

export const expected6b = `
(function (__ctx) {
  "use strict";
  return __mathOps.mul(
    __ensure(
      __fns["avg"](__ref("a", __ctx), __ref("b", __ctx), __ref("c", __ctx)),
    ),
    1000000000000n,
  );
});`;

export const expected6c = `
(function (__ctx) {
  "use strict";
  return __mathOps.mul(
    __ensure(
      __fns["avg"](
        __ref("a", __ctx),
        __ref("b", __ctx),
        __fns["sum"](__ref("c", __ctx), __ref("d", __ctx)),
      ),
    ),
    1000000000000n,
  );
});
`;

export const expected2 = `
(function (__ctx) {
  "use strict";
  return __mathOps.sub(
    __ensure(
      __mathOps.mul(
        __ensure(
          __mathOps.add(
            __ensure(
              __ctx && Object.prototype.hasOwnProperty.call(__ctx, "a")
                ? __ctx["a"]
                : (() => {
                    throw new Error("Unknown reference " + "a");
                  })(),
            ),
            __ensure(
              __ctx && Object.prototype.hasOwnProperty.call(__ctx, "b")
                ? __ctx["b"]
                : (() => {
                    throw new Error("Unknown reference " + "b");
                  })(),
            ),
          ),
        ),
        __ensure(
          __ctx && Object.prototype.hasOwnProperty.call(__ctx, "c")
            ? __ctx["c"]
            : (() => {
                throw new Error("Unknown reference " + "c");
              })(),
        ),
      ),
    ),
    __ensure(
      __mathOps.div(
        __ensure(
          __ctx && Object.prototype.hasOwnProperty.call(__ctx, "d")
            ? __ctx["d"]
            : (() => {
                throw new Error("Unknown reference " + "d");
              })(),
        ),
        __ensure(
          __ctx && Object.prototype.hasOwnProperty.call(__ctx, "e")
            ? __ctx["e"]
            : (() => {
                throw new Error("Unknown reference " + "e");
              })(),
        ),
      ),
    ),
  );
});`;

export const expected2b = `
(function (__ctx) {
  "use strict";
  return __mathOps.sub(
    __ensure(
      __mathOps.mul(
        __ensure(
          __mathOps.add(
            __ensure(__ref("a", __ctx)),
            __ensure(__ref("b", __ctx)),
          ),
        ),
        __ensure(__ref("c", __ctx)),
      ),
    ),
    __ensure(
      __mathOps.div(__ensure(__ref("d", __ctx)), __ensure(__ref("e", __ctx))),
    ),
  );
});`;

export const expected3 = `
(function (__ctx) {
  "use strict";
  return __mathOps.add(
    __ensure(__ref("x", __ctx)),
    __ensure(__ref("y", __ctx)),
  );
});`;

export const expected4 = `
(function (__ctx) {
  "use strict";
  return __mathOps.add(
    __ensure(__ref("x", __ctx)),
    __ensure(__ref("y", __ctx)),
  );
});
`;

export const expected5 = `
(function (__ctx) {
  "use strict";
  return {
    sum: __mathOps.add(
      __ensure(__ref("a", __ctx)),
      __ensure(__ref("b", __ctx)),
    ),
    items: [
      __mathOps.add(10000000000n, 10000000000n),
      __mathOps.mul(20000000000n, 20000000000n),
    ],
  };
});
`;

export const expected8 = `
(function (__ctx) {
  "use strict";
  return __mathOps.add(
    __ensure(__mathOps.add(__ensure("Hello "), __ensure(__ref("name", __ctx)))),
    __ensure("!"),
  );
});
`;

export const expected9 = `
(function (__ctx) {
  "use strict";
  return __mathOps.mul(
    __ensure(
      __fns["avg"]({
        a: "10",
        b: __fns["sum"]({
          x: "1",
          y: "988_444_444_333_333_222_111.999_888_77777",
          z: "10",
        }),
        c: "300888777666555444333222111",
      }),
    ),
    1000000000000n,
  );
});
`;