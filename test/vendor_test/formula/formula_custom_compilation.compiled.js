export const expected1 = `
(function (__ctx) {
  "use strict";
  return __mathOps.add(
    1000000000000009998887776665554441234567890n,
    __ensure(__mathOps.mul(2005000000000n, 30000000000n)),
  );
});`

export const expected6 = `
(function (__ctx) {
  "use strict";
  return __mathOps.mul(
    __ensure(
      __fns["avg"].call(
        __ctx,
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
});`

export const expected6b = `
(function (__ctx) {
  "use strict";
  return __mathOps.mul(
    __ensure(
      __fns["avg"].call(
        __ctx,
        __ref("a", __ctx),
        __ref("b", __ctx),
        __ref("c", __ctx),
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
      __mathOps.add(
        __ensure(
          __ctx && Object.prototype.hasOwnProperty.call(__ctx, "a")
            ? __ctx["a"]
            : (() => {
                throw new Error("Unknown reference " + "a");
              })(),
        ),
        __ensure(
          __mathOps.mul(
            __ensure(
              __ctx && Object.prototype.hasOwnProperty.call(__ctx, "b")
                ? __ctx["b"]
                : (() => {
                    throw new Error("Unknown reference " + "b");
                  })(),
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
});
`;

export const expected2b = `
(function (__ctx) {
  "use strict";
  return __mathOps.sub(
    __ensure(
      __mathOps.add(
        __ensure(__ref("a", __ctx)),
        __ensure(
          __mathOps.mul(
            __ensure(__ref("b", __ctx)),
            __ensure(__ref("c", __ctx)),
          ),
        ),
      ),
    ),
    __ensure(
      __mathOps.div(__ensure(__ref("d", __ctx)), __ensure(__ref("e", __ctx))),
    ),
  );
});`;