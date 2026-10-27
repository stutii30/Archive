import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { userService } from '../services/userService'
import useAuthStore from '../store/authStore'

export function useUserProfile(userId) {
  const isValidId = Boolean(userId && userId !== 'undefined' && userId !== 'null')
  return useQuery({
    queryKey: ['userProfile', isValidId ? userId : 'me'],
    queryFn: () => userService.getProfile(isValidId ? userId : undefined),
    staleTime: 1000 * 60 * 5,
  })
}

export function useUserUploads(userId, page = 0) {
  const isValidId = Boolean(userId && userId !== 'undefined' && userId !== 'null')
  return useQuery({
    queryKey: ['userUploads', userId, page],
    queryFn: () => userService.getUserUploads(userId, page),
    enabled: isValidId,
  })
}

export function useUserPosts(userId, page = 0) {
  const isValidId = Boolean(userId && userId !== 'undefined' && userId !== 'null')
  return useQuery({
    queryKey: ['userPosts', userId, page],
    queryFn: () => userService.getUserPosts(userId, page),
    enabled: isValidId,
  })
}

export function useUpdateProfile() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data) => userService.updateProfile(data),
    onSuccess: (updatedUser) => {
      const currentState = useAuthStore.getState()
      if (updatedUser && currentState.user) {
        currentState.setAuth({ ...currentState.user, ...updatedUser }, currentState.accessToken)
      }
      queryClient.invalidateQueries({ queryKey: ['userProfile'] })
      queryClient.invalidateQueries({ queryKey: ['resources'] })
    },
  })
}

export function useUploadAvatar() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (file) => userService.uploadAvatar(file),
    onSuccess: (res) => {
      const currentState = useAuthStore.getState()
      if (res?.avatarUrl && currentState.user) {
        currentState.setAuth({ ...currentState.user, avatarUrl: res.avatarUrl }, currentState.accessToken)
      }
      queryClient.invalidateQueries({ queryKey: ['userProfile'] })
    },
  })
}

export function useDeleteAccount() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: () => userService.deleteAccount(),
    onSuccess: () => {
      queryClient.clear()
    },
  })
}
