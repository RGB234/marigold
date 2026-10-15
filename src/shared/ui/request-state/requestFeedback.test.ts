import { mount } from "@vue/test-utils";
import { describe, expect, it } from "vitest";
import AsyncButton from "./AsyncButton.vue";
import RequestErrorState from "./RequestErrorState.vue";
import RequestLoadingState from "./RequestLoadingState.vue";

describe("request feedback components", () => {
  it("prevents duplicate actions while pending", () => {
    const wrapper = mount(AsyncButton, {
      props: { pending: true, pendingLabel: "저장 중..." },
      slots: { default: "저장" },
    });

    expect(wrapper.get("button").attributes("disabled")).toBeDefined();
    expect(wrapper.get("button").attributes("aria-busy")).toBe("true");
    expect(wrapper.text()).toBe("저장 중...");
  });

  it("emits retry from a reusable request error", async () => {
    const wrapper = mount(RequestErrorState, {
      props: { message: "연결할 수 없습니다." },
    });

    expect(wrapper.get('[role="alert"]').text()).toContain("연결할 수 없습니다.");
    await wrapper.get("button").trigger("click");
    expect(wrapper.emitted("retry")).toHaveLength(1);
  });

  it("exposes loading progress to assistive technology", () => {
    const wrapper = mount(RequestLoadingState, {
      props: { message: "목록을 불러오는 중입니다..." },
    });

    expect(wrapper.get('[role="status"]').text()).toContain("목록을 불러오는 중입니다...");
  });
});
