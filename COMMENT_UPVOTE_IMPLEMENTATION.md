# Comment Upvote System Implementation

## Overview
This implementation adds an upvote system to earthquake comments with the following features:

1. **Limited Comment Display**: Only 3 comments are shown on the main earthquake detail page
2. **Upvote Functionality**: Users can upvote comments they like
3. **Smart Sorting**: Comments are sorted by upvote count (highest first), then by date
4. **View All Comments**: A dedicated screen to view all comments with full functionality
5. **Real-time Updates**: Upvote counts update immediately

## Database Changes

### New Table: `comment_upvotes`
```sql
CREATE TABLE comment_upvotes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    comment_id UUID NOT NULL REFERENCES earthquake_comments(id) ON DELETE CASCADE,
    profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(comment_id, profile_id)
);
```

### Modified Table: `earthquake_comments`
- Added `upvotes_count` column (optional, for caching)

### Database Setup
Run the `database_setup.sql` file to:
1. Add the upvotes_count column
2. Create the comment_upvotes table
3. Set up indexes for performance
4. Configure RLS policies
5. Create triggers for automatic upvote counting

## Key Features

### 1. Main Earthquake Detail Page
- Shows only 3 comments
- Comments sorted by upvote count (highest first)
- Each comment has an upvote button
- "View All Comments" button to see all comments

### 2. All Comments Screen (`/all-comments`)
- Shows all comments for an earthquake
- Full upvote functionality
- Comment editing and deletion
- Add new comments
- Real-time updates

### 3. Upvote System
- Users can upvote/unupvote comments
- Visual feedback (filled/outline arrow)
- Upvote count displayed
- Prevents duplicate upvotes (unique constraint)

### 4. Sorting Logic
1. **Primary**: Upvote count (descending)
2. **Secondary**: Creation date (newest first)

## Implementation Details

### Hook: `useEarthquakeComments`
- Accepts optional `limit` parameter
- Fetches comments with upvote counts
- Handles upvote/unupvote operations
- Real-time cache invalidation

### Components
- `CommentItem`: Enhanced with upvote functionality
- `AllCommentsScreen`: New screen for viewing all comments

### API Functions
- `fetchComments`: Gets comments with upvote data
- `upvoteCommentApi`: Handles upvote/unupvote logic
- `addCommentApi`: Creates new comments
- `updateCommentApi`: Updates existing comments
- `deleteCommentApi`: Deletes comments

## Usage

### In Earthquake Detail Page
```typescript
const { comments, upvoteComment } = useEarthquakeComments(earthquakeId, 3);

// Handle upvote
const handleUpvote = async (commentId: string) => {
  await upvoteComment(commentId);
};
```

### Navigation to All Comments
```typescript
router.push({
  pathname: "/all-comments",
  params: {
    earthquakeId: id,
    earthquakeTitle: earthquake.title,
  },
});
```

## Styling
- Upvote buttons have active/inactive states
- Smooth transitions and visual feedback
- Consistent with app design system

## Security
- RLS policies ensure users can only manage their own upvotes
- Proper authentication checks
- Cascade deletion for data integrity

## Performance
- Indexes on frequently queried columns
- Efficient upvote counting
- Optimized queries with proper joins
- Cache invalidation for real-time updates 