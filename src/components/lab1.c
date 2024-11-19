#include <stdio.h>
#include <stdlib.h>

// Define the structure for a BST node
typedef struct Node {
    int data;
    struct Node *left, *right;
} Node;

// Function to create a new node
Node* createNode(int value) {
    Node* newNode = (Node*)malloc(sizeof(Node));
    newNode->data = value;
    newNode->left = newNode->right = NULL;
    return newNode;
}

// Function to insert a value into the BST
Node* insert(Node* root, int value) {
    if (root == NULL) {
        printf("Parent: NULL -> Adding %d as a root node.\n", value);
        return createNode(value);
    }
    if (value < root->data) {
        printf("Parent: %d -> Adding %d as left child.\n", root->data, value);
        root->left = insert(root->left, value);
    } else if (value > root->data) {
        printf("Parent: %d -> Adding %d as right child.\n", root->data, value);
        root->right = insert(root->right, value);
    }
    return root;
}

// Inorder Traversal with formatted output
void inorderTraversal(Node* root, int parent, int* traversal, int* index) {
    if (root != NULL) {
        inorderTraversal(root->left, root->data, traversal, index);
        printf("Parent: %d, Action: Visiting node\n", parent);
        printf("Child: %d, Action: Added to traversal\n", root->data);
        traversal[(*index)++] = root->data;
        inorderTraversal(root->right, root->data, traversal, index);
    }
}

// Preorder Traversal with formatted output
void preorderTraversal(Node* root, int parent, int* traversal, int* index) {
    if (root != NULL) {
        printf("Parent: %d, Action: Visiting node\n", parent);
        printf("Child: %d, Action: Added to traversal\n", root->data);
        traversal[(*index)++] = root->data;
        preorderTraversal(root->left, root->data, traversal, index);
        preorderTraversal(root->right, root->data, traversal, index);
    }
}

// Postorder Traversal with formatted output
void postorderTraversal(Node* root, int parent, int* traversal, int* index) {
    if (root != NULL) {
        postorderTraversal(root->left, root->data, traversal, index);
        postorderTraversal(root->right, root->data, traversal, index);
        printf("Parent: %d, Action: Visiting node\n", parent);
        printf("Child: %d, Action: Added to traversal\n", root->data);
        traversal[(*index)++] = root->data;
    }
}

// Function to print the whole traversal
void printTraversal(const char* name, int* traversal, int size) {
    printf("%s Traversal: ", name);
    for (int i = 0; i < size; i++) {
        printf("%d ", traversal[i]);
    }
    printf("\n");
}

// Main function
int main() {
    Node* root = NULL;
    int n, value;

    // Input the number of elements
    printf("Enter the number of elements: ");
    scanf("%d", &n);

    // Input the elements one by one and insert them into the BST
    printf("Enter the elements:\n");
    for (int i = 0; i < n; i++) {
        scanf("%d", &value);
        root = insert(root, value);
    }

    // Arrays to store traversal results
    int inorder[100], preorder[100], postorder[100];
    int inorderIndex = 0, preorderIndex = 0, postorderIndex = 0;

    // Perform traversals
    printf("\nInorder Traversal:\n");
    inorderTraversal(root, -1, inorder, &inorderIndex);
    printTraversal("Inorder", inorder, inorderIndex);

    printf("\nPreorder Traversal:\n");
    preorderTraversal(root, -1, preorder, &preorderIndex);
    printTraversal("Preorder", preorder, preorderIndex);

    printf("\nPostorder Traversal:\n");
    postorderTraversal(root, -1, postorder, &postorderIndex);
    printTraversal("Postorder", postorder, postorderIndex);

    return 0;
}