package com.weeklycommit.entity;

import jakarta.persistence.*;

@Entity
@Table(name = "manager_assignments", uniqueConstraints = {
    @UniqueConstraint(columnNames = {"manager_id", "member_id"})
})
public class ManagerAssignment {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private java.util.UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "manager_id", referencedColumnName = "user_id", nullable = false)
    private AppUser manager;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "member_id", referencedColumnName = "user_id", nullable = false)
    private AppUser member;

    public java.util.UUID getId() { return id; }
    public void setId(java.util.UUID id) { this.id = id; }
    public AppUser getManager() { return manager; }
    public void setManager(AppUser manager) { this.manager = manager; }
    public AppUser getMember() { return member; }
    public void setMember(AppUser member) { this.member = member; }
}
