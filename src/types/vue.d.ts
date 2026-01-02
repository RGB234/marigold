// 1. '*.vue'로 끝나는 모든 파일(모듈)에 대해 정의하겠다는 뜻입니다.
declare module '*.vue' {
    
    // 2. Vue 라이브러리에서 컴포넌트의 타입 정의를 가져옵니다.
    import type { DefineComponent } from 'vue'
    
    // 3. component라는 변수는 "Vue 컴포넌트 타입"이라고 지정합니다.
    //    <{}, {}, any>는 Props나 설정들이 범용적(any)이라는 의미입니다.
    const component: DefineComponent<{}, {}, any>
    
    // 4. 이 모듈(파일)을 import 하면 위에서 정의한 component가 기본값(default)으로 나갑니다.
    export default component
}