import { test, expect } from '@playwright/test';

test('has title', async ({ page }) => {
  await page.goto('/');

  // 이 부분은 실제 앱의 타이틀이나 주요 요소에 맞춰 수정 필요
  // await expect(page).toHaveTitle(/Marigold/);
});

test('login and view adoption post flow', async ({ page }) => {
  // 핵심 User Flow 검증 시나리오 예시
  await page.goto('/');

  // 1. 로그인 
  // await page.getByRole('link', { name: '로그인' }).click();
  // await page.getByLabel('이메일').fill('test@example.com');
  // await page.getByLabel('비밀번호').fill('password123!');
  // await page.getByRole('button', { name: '로그인' }).click();

  // 2. 입양 게시글 목록 조회
  // await page.getByRole('link', { name: '입양' }).click();
  // await expect(page.locator('.adoption-list')).toBeVisible();

  // 3. 상세 페이지 진입
  // await page.locator('.adoption-item').first().click();
  
  // 4. 채팅 요청
  // await page.getByRole('button', { name: '채팅하기' }).click();
  // await expect(page.locator('.chat-room')).toBeVisible();
});
