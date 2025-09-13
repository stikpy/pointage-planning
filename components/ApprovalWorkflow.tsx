"use client";

import React, { useState } from 'react';
import { 
  CheckCircle, 
  XCircle, 
  Clock, 
  User, 
  MessageSquare, 
  AlertTriangle,
  Eye,
  Send,
  History,
  Calendar,
  Users
} from 'lucide-react';
import { Shift, User as UserType } from '../types';
import { useAuth } from '../lib/auth';

interface ApprovalRequest {
  id: string;
  type: 'shift_creation' | 'shift_modification' | 'shift_deletion' | 'overtime' | 'template';
  title: string;
  description: string;
  requester: UserType;
  approver?: UserType;
  status: 'pending' | 'approved' | 'rejected' | 'cancelled';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  createdAt: Date;
  updatedAt: Date;
  data: any; // Données spécifiques à la demande
  comments: ApprovalComment[];
}

interface ApprovalComment {
  id: string;
  author: UserType;
  content: string;
  timestamp: Date;
  type: 'comment' | 'approval' | 'rejection';
}

interface ApprovalWorkflowProps {
  requests: ApprovalRequest[];
  onApprove: (requestId: string, comment?: string) => void;
  onReject: (requestId: string, comment: string) => void;
  onComment: (requestId: string, content: string) => void;
  onCreateRequest: (request: Partial<ApprovalRequest>) => void;
}

export default function ApprovalWorkflow({
  requests,
  onApprove,
  onReject,
  onComment,
  onCreateRequest
}: ApprovalWorkflowProps) {
  const { user, hasPermission } = useAuth();
  const [selectedRequest, setSelectedRequest] = useState<ApprovalRequest | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [newComment, setNewComment] = useState('');

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'approved': return 'bg-green-100 text-green-800';
      case 'rejected': return 'bg-red-100 text-red-800';
      case 'cancelled': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'bg-red-500';
      case 'high': return 'bg-orange-500';
      case 'medium': return 'bg-yellow-500';
      case 'low': return 'bg-green-500';
      default: return 'bg-gray-500';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'shift_creation': return Calendar;
      case 'shift_modification': return Clock;
      case 'shift_deletion': return XCircle;
      case 'overtime': return AlertTriangle;
      case 'template': return Users;
      default: return MessageSquare;
    }
  };

  const handleApprove = () => {
    if (selectedRequest) {
      onApprove(selectedRequest.id, newComment);
      setShowModal(false);
      setSelectedRequest(null);
      setNewComment('');
    }
  };

  const handleReject = () => {
    if (selectedRequest && newComment.trim()) {
      onReject(selectedRequest.id, newComment);
      setShowModal(false);
      setSelectedRequest(null);
      setNewComment('');
    }
  };

  const handleComment = () => {
    if (selectedRequest && newComment.trim()) {
      onComment(selectedRequest.id, newComment);
      setNewComment('');
    }
  };

  const pendingRequests = requests.filter(r => r.status === 'pending');
  const myRequests = requests.filter(r => r.requester.id === user?.id);
  const assignedToMe = requests.filter(r => r.approver?.id === user?.id && r.status === 'pending');

  return (
    <div className="bg-white rounded-lg shadow-lg">
      {/* En-tête */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Workflow d'Approbation</h2>
            <p className="text-gray-600">Gérez les demandes d'approbation</p>
          </div>
          
          {hasPermission('shifts', 'write') && (
            <button
              onClick={() => {
                // Ouvrir modal de création de demande
                setShowModal(true);
              }}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center"
            >
              <Send className="w-4 h-4 mr-2" />
              Nouvelle demande
            </button>
          )}
        </div>
      </div>

      <div className="p-6">
        {/* Statistiques */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-yellow-50 p-4 rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-yellow-600">En attente</p>
                <p className="text-2xl font-bold text-yellow-800">{pendingRequests.length}</p>
              </div>
              <Clock className="w-8 h-8 text-yellow-600" />
            </div>
          </div>
          
          <div className="bg-blue-50 p-4 rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-blue-600">Mes demandes</p>
                <p className="text-2xl font-bold text-blue-800">{myRequests.length}</p>
              </div>
              <User className="w-8 h-8 text-blue-600" />
            </div>
          </div>
          
          <div className="bg-purple-50 p-4 rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-purple-600">À approuver</p>
                <p className="text-2xl font-bold text-purple-800">{assignedToMe.length}</p>
              </div>
              <CheckCircle className="w-8 h-8 text-purple-600" />
            </div>
          </div>
          
          <div className="bg-gray-50 p-4 rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total</p>
                <p className="text-2xl font-bold text-gray-800">{requests.length}</p>
              </div>
              <History className="w-8 h-8 text-gray-600" />
            </div>
          </div>
        </div>

        {/* Liste des demandes */}
        <div className="space-y-4">
          {requests.length === 0 ? (
            <div className="text-center py-12">
              <MessageSquare className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Aucune demande</h3>
              <p className="text-gray-600">Aucune demande d'approbation pour le moment</p>
            </div>
          ) : (
            requests.map(request => {
              const TypeIcon = getTypeIcon(request.type);
              
              return (
                <div
                  key={request.id}
                  className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer"
                  onClick={() => {
                    setSelectedRequest(request);
                    setShowModal(true);
                  }}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-3">
                      <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                        <TypeIcon className="w-5 h-5 text-blue-600" />
                      </div>
                      
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-1">
                          <h3 className="font-semibold text-gray-900">{request.title}</h3>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(request.status)}`}>
                            {request.status === 'pending' ? 'En attente' :
                             request.status === 'approved' ? 'Approuvé' :
                             request.status === 'rejected' ? 'Rejeté' : 'Annulé'}
                          </span>
                          <div className={`w-2 h-2 rounded-full ${getPriorityColor(request.priority)}`}></div>
                        </div>
                        
                        <p className="text-gray-600 text-sm mb-2">{request.description}</p>
                        
                        <div className="flex items-center space-x-4 text-xs text-gray-500">
                          <span className="flex items-center">
                            <User className="w-3 h-3 mr-1" />
                            {request.requester.profile.firstName} {request.requester.profile.lastName}
                          </span>
                          <span className="flex items-center">
                            <Clock className="w-3 h-3 mr-1" />
                            {request.createdAt.toLocaleDateString('fr-FR')}
                          </span>
                          {request.approver && (
                            <span className="flex items-center">
                              <CheckCircle className="w-3 h-3 mr-1" />
                              {request.approver.profile.firstName} {request.approver.profile.lastName}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      {request.comments.length > 0 && (
                        <div className="flex items-center text-xs text-gray-500">
                          <MessageSquare className="w-3 h-3 mr-1" />
                          {request.comments.length}
                        </div>
                      )}
                      
                      <button className="p-2 hover:bg-gray-100 rounded-lg">
                        <Eye className="w-4 h-4 text-gray-500" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Modal de détail */}
      {showModal && selectedRequest && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">{selectedRequest.title}</h3>
                <button
                  onClick={() => setShowModal(false)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  ✕
                </button>
              </div>
            </div>

            <div className="p-6 space-y-6">
              {/* Informations de la demande */}
              <div>
                <h4 className="font-medium text-gray-900 mb-3">Détails de la demande</h4>
                <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Type:</span>
                    <span className="font-medium">{selectedRequest.type}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Demandeur:</span>
                    <span className="font-medium">
                      {selectedRequest.requester.profile.firstName} {selectedRequest.requester.profile.lastName}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Statut:</span>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(selectedRequest.status)}`}>
                      {selectedRequest.status}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Priorité:</span>
                    <span className="font-medium">{selectedRequest.priority}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Date:</span>
                    <span className="font-medium">
                      {selectedRequest.createdAt.toLocaleString('fr-FR')}
                    </span>
                  </div>
                </div>
              </div>

              {/* Description */}
              <div>
                <h4 className="font-medium text-gray-900 mb-3">Description</h4>
                <p className="text-gray-600">{selectedRequest.description}</p>
              </div>

              {/* Données spécifiques */}
              {selectedRequest.data && (
                <div>
                  <h4 className="font-medium text-gray-900 mb-3">Données</h4>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <pre className="text-sm text-gray-600 whitespace-pre-wrap">
                      {JSON.stringify(selectedRequest.data, null, 2)}
                    </pre>
                  </div>
                </div>
              )}

              {/* Commentaires */}
              <div>
                <h4 className="font-medium text-gray-900 mb-3">Commentaires</h4>
                <div className="space-y-3">
                  {selectedRequest.comments.map(comment => (
                    <div key={comment.id} className="border border-gray-200 rounded-lg p-3">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium text-sm">
                          {comment.author.profile.firstName} {comment.author.profile.lastName}
                        </span>
                        <span className="text-xs text-gray-500">
                          {comment.timestamp.toLocaleString('fr-FR')}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600">{comment.content}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Nouveau commentaire */}
              <div>
                <h4 className="font-medium text-gray-900 mb-3">Ajouter un commentaire</h4>
                <div className="space-y-3">
                  <textarea
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    placeholder="Votre commentaire..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    rows={3}
                  />
                  <button
                    onClick={handleComment}
                    disabled={!newComment.trim()}
                    className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    Commenter
                  </button>
                </div>
              </div>
            </div>

            {/* Actions */}
            {selectedRequest.status === 'pending' && hasPermission('shifts', 'approve') && (
              <div className="p-6 border-t border-gray-200 flex justify-end space-x-3">
                <button
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800"
                >
                  Fermer
                </button>
                <button
                  onClick={handleReject}
                  disabled={!newComment.trim()}
                  className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center"
                >
                  <XCircle className="w-4 h-4 mr-2" />
                  Rejeter
                </button>
                <button
                  onClick={handleApprove}
                  className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors flex items-center"
                >
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Approuver
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}