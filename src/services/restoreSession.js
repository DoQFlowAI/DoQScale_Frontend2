// 소유: 공통 베이스
import { useAuthStore } from '../store/authStore';
import { refreshAccessToken } from './tokenRefresh';
import { userService } from './userService';
import { expireSession } from './session';

let restoring = null;

export function restoreSession() {
    if (!restoring) {
        restoring = refreshAccessToken()
            .then(async (accessToken) => {
                const me = await userService.me();
                useAuthStore.getState().login(me, accessToken);
            })
            .catch(() => {
                expireSession();
            });
    }
    return restoring;
}
