interface AvatarParams {
  name: string;
  variant?: number;
}

export const getAvatarUrl = ({ name, variant = 0 }: AvatarParams): string => {
  return `https://api.dicebear.com/9.x/avataaars/svg?seed=${name}_${variant}`;
};
