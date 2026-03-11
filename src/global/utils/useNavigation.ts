import { useRouter } from 'vue-router';

export function useNavigation() {
  const safeBack = (fallbackRouteName : string = 'Home') => {
    const router = useRouter();
    if (window.history.state && window.history.state.back) {
      router.back();
    } else {
      router.push({name: fallbackRouteName});
    }
  };

  return { safeBack };
}