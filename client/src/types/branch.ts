export interface Branch {
  _id: string;
  name: string;
  code: string;
  location?: string;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface BranchInput {
  name: string;
  code: string;
  location?: string;
  isActive?: boolean;
}
