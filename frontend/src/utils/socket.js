import { getSocket as getSocketInstance } from "../services/socketService"

export const getSocket = () => {
  return getSocketInstance()
}

