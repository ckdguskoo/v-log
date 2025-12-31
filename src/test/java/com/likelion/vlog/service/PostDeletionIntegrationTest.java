package com.likelion.vlog.service;

import com.likelion.vlog.dto.auth.SignupRequest;
import com.likelion.vlog.dto.comments.CommentCreatePostRequest;
import com.likelion.vlog.dto.comments.ReplyCreatePostRequest;
import com.likelion.vlog.dto.posts.PostCreatePostRequest;
import com.likelion.vlog.dto.posts.PostGetResponse;
import com.likelion.vlog.entity.User;
import com.likelion.vlog.repository.*;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

import org.springframework.test.context.ActiveProfiles;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * 게시글 삭제 통합 테스트
 * - 회원가입 → 게시글 작성 → 댓글 작성 → 답글 작성 → 좋아요 → 게시글 삭제
 * - 게시글 삭제 시 연관 데이터(댓글, 좋아요, 태그) 모두 삭제되는지 확인
 */
@SpringBootTest
@Transactional
@ActiveProfiles("test")
class PostDeletionIntegrationTest {

    @Autowired
    private AuthService authService;

    @Autowired
    private PostService postService;

    @Autowired
    private CommentService commentService;

    @Autowired
    private LikeService likeService;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PostRepository postRepository;

    @Autowired
    private CommentRepository commentRepository;

    @Autowired
    private LikeRepository likeRepository;

    @Autowired
    private TagMapRepository tagMapRepository;

    private String userEmail;
    private String userPassword;
    private Long postId;
    private Long commentId;

    @BeforeEach
    void setUp() {
        userEmail = "test@test.com";
        userPassword = "password123";
    }

    @Test
    @DisplayName("게시글 삭제 시 모든 연관 데이터가 삭제된다")
    void deletePost_shouldDeleteAllRelatedData() {
        // Given: 회원가입
        SignupRequest signupRequest = new SignupRequest();
        signupRequest.setEmail(userEmail);
        signupRequest.setPassword(userPassword);
        signupRequest.setNickname("테스터");
        authService.signup(signupRequest);

        User user = userRepository.findByEmail(userEmail).orElseThrow();

        // Given: 게시글 작성 (태그 포함)
        PostCreatePostRequest postRequest = new PostCreatePostRequest();
        postRequest.setTitle("테스트 게시글");
        postRequest.setContent("테스트 내용입니다.");
        postRequest.setTags(List.of("자바", "스프링", "테스트"));

        PostGetResponse createdPost = postService.createPost(postRequest, userEmail);
        postId = createdPost.getPostId();

        // Given: 댓글 작성
        CommentCreatePostRequest commentRequest = new CommentCreatePostRequest();
        commentRequest.setContent("댓글 내용입니다.");

        var commentResponse = commentService.createComment(postId, commentRequest, userEmail);
        commentId = commentResponse.getCommentId();

        // Given: 답글 작성
        ReplyCreatePostRequest replyRequest = new ReplyCreatePostRequest();
        replyRequest.setContent("답글 내용입니다.");

        commentService.createReply(postId, commentId, replyRequest, userEmail);

        // Given: 좋아요
        likeService.addLike(userEmail, postId);

        // Given: 삭제 전 데이터 개수 확인
        long commentCountBefore = commentRepository.count();
        long likeCountBefore = likeRepository.count();
        long tagMapCountBefore = tagMapRepository.count();
        long postCountBefore = postRepository.count();

        assertThat(commentCountBefore).isEqualTo(2); // 댓글 1개 + 답글 1개
        assertThat(likeCountBefore).isEqualTo(1);
        assertThat(tagMapCountBefore).isEqualTo(3);
        assertThat(postCountBefore).isEqualTo(1);

        // When: 게시글 삭제
        postService.deletePost(postId, userEmail);

        // Then: 모든 데이터가 삭제되었는지 확인 (cascade delete)
        assertThat(postRepository.count()).isEqualTo(0);
        assertThat(commentRepository.count()).isEqualTo(0);
        assertThat(likeRepository.count()).isEqualTo(0);
        assertThat(tagMapRepository.count()).isEqualTo(0);
    }

    @Test
    @DisplayName("게시글 삭제 시 다른 사용자의 댓글도 함께 삭제된다")
    void deletePost_shouldDeleteOtherUsersComments() {
        // Given: 게시글 작성자 회원가입
        SignupRequest authorSignup = new SignupRequest();
        authorSignup.setEmail("author@test.com");
        authorSignup.setPassword("password123");
        authorSignup.setNickname("작성자");
        authService.signup(authorSignup);

        // Given: 댓글 작성자 회원가입
        SignupRequest commenterSignup = new SignupRequest();
        commenterSignup.setEmail("commenter@test.com");
        commenterSignup.setPassword("password123");
        commenterSignup.setNickname("댓글러");
        authService.signup(commenterSignup);

        // Given: 게시글 작성
        PostCreatePostRequest postRequest = new PostCreatePostRequest();
        postRequest.setTitle("테스트 게시글");
        postRequest.setContent("테스트 내용");
        postRequest.setTags(List.of("테스트"));

        PostGetResponse post = postService.createPost(postRequest, "author@test.com");
        Long postId = post.getPostId();

        // Given: 다른 사용자가 댓글 작성
        CommentCreatePostRequest commentRequest = new CommentCreatePostRequest();
        commentRequest.setContent("다른 사용자의 댓글");

        commentService.createComment(postId, commentRequest, "commenter@test.com");

        // Given: 다른 사용자가 좋아요
        likeService.addLike("commenter@test.com", postId);

        // Given: 삭제 전 데이터 개수 확인
        long commentCountBefore = commentRepository.count();
        long likeCountBefore = likeRepository.count();

        assertThat(commentCountBefore).isEqualTo(1); // commenter의 댓글 1개
        assertThat(likeCountBefore).isEqualTo(1); // commenter의 좋아요 1개

        // When: 게시글 작성자가 게시글 삭제
        postService.deletePost(postId, "author@test.com");

        // Then: 다른 사용자의 댓글과 좋아요도 함께 삭제되었는지 확인
        assertThat(postRepository.findById(postId)).isEmpty();
        assertThat(commentRepository.count()).isEqualTo(0);
        assertThat(likeRepository.count()).isEqualTo(0);
    }
}